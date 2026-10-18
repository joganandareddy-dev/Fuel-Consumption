"""
Mileage Calculation and Validation Engine using Pandas and NumPy.
Strictly adheres to full-tank-to-full-tank interval logic, detects invalid
records, handles partial refills transparently, and avoids fabricating mileage.
"""

import pandas as pd
import numpy as np
from datetime import datetime

class MileageEngine:
    @staticmethod
    def process_records(fuel_records, vehicles_dict=None):
        """
        Process a list of raw fuel records dictionaries.
        Computes distance, interval mileage, cost per km, validity flags,
        and generates an invalid records register.
        """
        if not fuel_records:
            return {
                "records": [],
                "invalid_records": [],
                "vehicle_summaries": {},
                "total_valid_records": 0,
                "total_invalid_records": 0
            }

        # Convert to DataFrame
        df = pd.DataFrame(fuel_records)
        
        # Ensure correct column types
        df['record_id'] = pd.to_numeric(df['record_id'])
        df['vehicle_id'] = pd.to_numeric(df['vehicle_id'])
        df['odometer_km'] = pd.to_numeric(df['odometer_km'], errors='coerce')
        df['litres'] = pd.to_numeric(df['litres'], errors='coerce')
        df['total_cost'] = pd.to_numeric(df['total_cost'], errors='coerce')
        df['full_tank_flag'] = df['full_tank_flag'].astype(bool)
        df['fill_date'] = pd.to_datetime(df['fill_date'], errors='coerce')

        # Attach vehicle code/type if available
        if vehicles_dict:
            df['vehicle_code'] = df['vehicle_id'].apply(lambda vid: vehicles_dict.get(vid, {}).get('vehicle_code', f"Vehicle #{vid}"))
            df['vehicle_type'] = df['vehicle_id'].apply(lambda vid: vehicles_dict.get(vid, {}).get('vehicle_type', 'Unknown'))
            df['fuel_type'] = df['vehicle_id'].apply(lambda vid: vehicles_dict.get(vid, {}).get('fuel_type', 'Unknown'))
        else:
            df['vehicle_code'] = df['vehicle_id'].apply(lambda vid: f"Vehicle #{vid}")
            df['vehicle_type'] = 'Unknown'
            df['fuel_type'] = 'Unknown'

        # Initialize output columns
        df['is_valid'] = True
        df['issue_description'] = None
        df['recommended_correction'] = None
        df['distance_km'] = np.nan
        df['mileage_km_per_l'] = np.nan
        df['cost_per_km'] = np.nan
        df['interval_type'] = 'Standard'
        df['is_valid_interval'] = False
        df['calculation_note'] = ''

        processed_records = []
        invalid_records = []

        # Process per vehicle in strict chronological order
        grouped = df.groupby('vehicle_id', group_keys=False)

        for vehicle_id, group in grouped:
            # Sort chronologically by fill_date, then odometer_km, then record_id
            sorted_group = group.sort_values(by=['fill_date', 'odometer_km', 'record_id']).copy()
            
            last_valid_odometer = None
            interval_start_odometer = None
            interval_accumulated_litres = 0.0
            interval_accumulated_cost = 0.0
            interval_partial_records_count = 0
            has_baseline = False

            for idx, row in sorted_group.iterrows():
                rec = row.to_dict()
                rec['fill_date'] = rec['fill_date'].strftime('%Y-%m-%d') if pd.notnull(rec['fill_date']) else ''
                
                issues = []
                corrections = []

                # 1. Base input field validations
                if pd.isna(rec['litres']) or rec['litres'] <= 0:
                    issues.append(f"Invalid fuel quantity ({rec.get('litres', 0)} L). Litres must be greater than zero.")
                    corrections.append("Update fuel litres with the actual measured quantity from the fuel receipt.")

                if pd.isna(rec['total_cost']) or rec['total_cost'] < 0:
                    issues.append(f"Invalid fuel cost (₹{rec.get('total_cost', 0)}). Cost cannot be negative.")
                    corrections.append("Enter the correct total transaction amount in ₹.")

                if pd.isna(rec['odometer_km']) or rec['odometer_km'] < 0:
                    issues.append("Negative or missing odometer reading.")
                    corrections.append("Enter the non-negative odometer reading shown on the dashboard cluster.")

                # 2. Chronological Odometer validation against prior valid reading
                if last_valid_odometer is not None and pd.notnull(rec['odometer_km']):
                    if rec['odometer_km'] < last_valid_odometer:
                        issues.append(f"Odometer rollback / decreasing reading: {rec['odometer_km']:,.1f} km is less than previous reading {last_valid_odometer:,.1f} km.")
                        corrections.append(f"Check odometer cluster for typo. Reading should be at least {last_valid_odometer:,.1f} km or verify if meter was swapped/reset.")
                    elif rec['odometer_km'] == last_valid_odometer:
                        issues.append(f"Duplicate / unchanged odometer reading ({rec['odometer_km']:,.1f} km). Distance travelled is zero.")
                        corrections.append("Verify reading. If vehicle did not travel, this cannot form a valid mileage interval.")

                # Handle Invalid Record
                if issues:
                    rec['is_valid'] = False
                    rec['issue_description'] = "; ".join(issues)
                    rec['recommended_correction'] = " | ".join(corrections)
                    rec['interval_type'] = 'Invalid Record'
                    rec['is_valid_interval'] = False
                    rec['calculation_note'] = 'Excluded from mileage calculation due to validation failure.'
                    invalid_records.append(rec)
                    processed_records.append(rec)
                    # Note: We do NOT update last_valid_odometer or interval tracking with an invalid record!
                    continue

                # Record is physically valid!
                rec['is_valid'] = True
                curr_odo = float(rec['odometer_km'])
                curr_litres = float(rec['litres'])
                curr_cost = float(rec['total_cost'])
                curr_full_tank = bool(rec['full_tank_flag'])

                # 3. Distance from previous valid record
                if last_valid_odometer is None:
                    # Baseline initial fill for this vehicle
                    rec['distance_km'] = 0.0
                    rec['interval_type'] = 'Baseline Fill'
                    rec['is_valid_interval'] = False
                    rec['calculation_note'] = 'Starting baseline odometer reading for vehicle.'
                    last_valid_odometer = curr_odo
                    
                    if curr_full_tank:
                        interval_start_odometer = curr_odo
                        interval_accumulated_litres = 0.0
                        interval_accumulated_cost = 0.0
                        interval_partial_records_count = 0
                        has_baseline = True
                    else:
                        rec['calculation_note'] = 'Starting partial fill. Full-tank interval tracking begins on first 100% full tank.'
                else:
                    dist = curr_odo - last_valid_odometer
                    rec['distance_km'] = round(dist, 2)
                    last_valid_odometer = curr_odo

                    # 4. Full-tank interval calculations
                    if not has_baseline:
                        # We haven't had a full tank start yet
                        if curr_full_tank:
                            has_baseline = True
                            interval_start_odometer = curr_odo
                            interval_accumulated_litres = 0.0
                            interval_accumulated_cost = 0.0
                            interval_partial_records_count = 0
                            rec['interval_type'] = 'Baseline Full Tank'
                            rec['is_valid_interval'] = False
                            rec['calculation_note'] = 'First full tank achieved. Subsequent fills will form valid mileage intervals.'
                        else:
                            rec['interval_type'] = 'Partial Refill'
                            rec['is_valid_interval'] = False
                            # Approximate distance per litre (strictly labeled as partial, not exact mileage)
                            approx = dist / curr_litres if curr_litres > 0 else 0
                            rec['approx_km_per_l'] = round(approx, 2)
                            rec['calculation_note'] = f'Partial fill before baseline established. Approx {approx:.1f} km/L, not exact full-tank mileage.'
                    else:
                        # Baseline full tank exists. Accumulate fuel used since interval_start_odometer
                        interval_accumulated_litres += curr_litres
                        interval_accumulated_cost += curr_cost

                        if curr_full_tank:
                            # Complete full-tank interval!
                            total_interval_dist = curr_odo - interval_start_odometer
                            
                            if interval_accumulated_litres > 0 and total_interval_dist > 0:
                                valid_mileage = total_interval_dist / interval_accumulated_litres
                                cost_km = interval_accumulated_cost / total_interval_dist
                                
                                rec['mileage_km_per_l'] = round(float(valid_mileage), 2)
                                rec['cost_per_km'] = round(float(cost_km), 2)
                                rec['is_valid_interval'] = True
                                rec['interval_type'] = 'Full-Tank Interval'
                                
                                if interval_partial_records_count > 0:
                                    rec['calculation_note'] = (
                                        f'Multi-fill cycle: {total_interval_dist:,.1f} km on {interval_accumulated_litres:,.1f} L '
                                        f'across {interval_partial_records_count} intermediate partial refill(s).'
                                    )
                                else:
                                    rec['calculation_note'] = (
                                        f'Consecutive full-tank cycle: {total_interval_dist:,.1f} km on {interval_accumulated_litres:,.1f} L.'
                                    )
                            else:
                                rec['calculation_note'] = 'Insufficient interval distance or fuel for calculation.'

                            # Reset interval tracking for the next cycle
                            interval_start_odometer = curr_odo
                            interval_accumulated_litres = 0.0
                            interval_accumulated_cost = 0.0
                            interval_partial_records_count = 0
                        else:
                            # Intermediate partial refill
                            interval_partial_records_count += 1
                            rec['interval_type'] = 'Partial Refill'
                            rec['is_valid_interval'] = False
                            approx = dist / curr_litres if curr_litres > 0 else 0
                            rec['approx_km_per_l'] = round(approx, 2)
                            rec['calculation_note'] = (
                                f'Partial refill: tank was not filled to full cut-off. '
                                f'Approx {approx:.1f} km/L for this segment. Litres ({curr_litres:.1f} L) will be '
                                f'summed into the next full-tank interval calculation.'
                            )

                processed_records.append(rec)

        def sanitize_val(v):
            if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                return None
            return v

        sanitized_records = [{k: sanitize_val(v) for k, v in r.items()} for r in processed_records]
        sanitized_invalids = [{k: sanitize_val(v) for k, v in r.items()} for r in invalid_records]

        return {
            "records": sanitized_records,
            "invalid_records": sanitized_invalids,
            "total_valid_records": len(sanitized_records) - len(sanitized_invalids),
            "total_invalid_records": len(sanitized_invalids)
        }

